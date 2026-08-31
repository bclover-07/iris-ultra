import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/env.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  late final Dio dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  bool _isRefreshing = false;
  final List<_RetryRequest> _retryQueue = [];
  void Function()? onUnauthenticated;

  ApiService._internal() {
    dio = Dio(BaseOptions(
      baseUrl: Env.apiBaseUrl,
      connectTimeout: Env.connectTimeout,
      receiveTimeout: Env.receiveTimeout,
      headers: {'Content-Type': 'application/json'},
    ));

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: _onRequest,
      onResponse: _onResponse,
      onError: _onError,
    ));
  }

  Future<void> _onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _storage.read(key: 'accessToken');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  void _onResponse(Response response, ResponseInterceptorHandler handler) {
    handler.next(response);
  }

  Future<void> _onError(
    DioException error,
    ErrorInterceptorHandler handler,
  ) async {
    if (error.response?.statusCode == 401 &&
        !error.requestOptions.path.contains('/auth/login') &&
        !error.requestOptions.path.contains('/auth/refresh') &&
        error.requestOptions.extra['_retry'] != true) {
      if (_isRefreshing) {
        _retryQueue.add(_RetryRequest(error.requestOptions, handler));
        return;
      }

      _isRefreshing = true;

      try {
        final refreshToken = await _storage.read(key: 'refreshToken');
        final refreshResponse = await Dio(BaseOptions(
          baseUrl: Env.apiBaseUrl,
          connectTimeout: Env.connectTimeout,
          headers: {
            if (refreshToken != null) 'Authorization': 'Bearer $refreshToken',
          },
        )).post('/api/auth/refresh');

        final newToken = refreshResponse.data['accessToken'];
        await _storage.write(key: 'accessToken', value: newToken);

        error.requestOptions.headers['Authorization'] = 'Bearer $newToken';
        error.requestOptions.extra['_retry'] = true;

        for (final req in _retryQueue) {
          req.options.headers['Authorization'] = 'Bearer $newToken';
          try {
            final resp = await dio.fetch(req.options);
            req.handler.resolve(resp);
          } catch (e) {
            req.handler.reject(e as DioException);
          }
        }
        _retryQueue.clear();

        final retryResponse = await dio.fetch(error.requestOptions);
        handler.resolve(retryResponse);
      } catch (refreshError) {
        for (final req in _retryQueue) {
          req.handler.reject(DioException(
            requestOptions: req.options,
            error: 'Token refresh failed',
          ));
        }
        _retryQueue.clear();

        await clearToken();
        onUnauthenticated?.call();
        handler.reject(error);
      } finally {
        _isRefreshing = false;
      }
    } else {
      handler.next(error);
    }
  }

  Future<void> setToken(String token) async {
    await _storage.write(key: 'accessToken', value: token);
  }

  Future<void> setRefreshToken(String token) async {
    await _storage.write(key: 'refreshToken', value: token);
  }

  Future<void> clearToken() async {
    await _storage.delete(key: 'accessToken');
    await _storage.delete(key: 'refreshToken');
  }

  Future<String?> getToken() async {
    return await _storage.read(key: 'accessToken');
  }

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters, Options? options}) {
    return dio.get(path, queryParameters: queryParameters, options: options);
  }

  Future<Response> post(String path, {dynamic data, Options? options}) {
    return dio.post(path, data: data, options: options);
  }

  Future<Response> put(String path, {dynamic data, Options? options}) {
    return dio.put(path, data: data, options: options);
  }

  Future<Response> patch(String path, {dynamic data, Options? options}) {
    return dio.patch(path, data: data, options: options);
  }

  Future<Response> delete(String path, {Options? options}) {
    return dio.delete(path, options: options);
  }

  // Authenticated Helper Methods that return Response.data directly
  Future<dynamic> authenticatedGet(String path, {Map<String, dynamic>? queryParameters, Options? options}) async {
    final response = await get(path, queryParameters: queryParameters, options: options);
    return response.data;
  }

  Future<dynamic> authenticatedPost(String path, {dynamic data, Options? options}) async {
    final response = await post(path, data: data, options: options);
    return response.data;
  }

  Future<dynamic> authenticatedPut(String path, {dynamic data, Options? options}) async {
    final response = await put(path, data: data, options: options);
    return response.data;
  }

  Future<dynamic> authenticatedDelete(String path, {Options? options}) async {
    final response = await delete(path, options: options);
    return response.data;
  }

  Future<dynamic> authenticatedUpload(String path, FormData formData, {Options? options}) async {
    final response = await post(path, data: formData, options: options);
    return response.data;
  }
}

class _RetryRequest {
  final RequestOptions options;
  final ErrorInterceptorHandler handler;

  _RetryRequest(this.options, this.handler);
}
