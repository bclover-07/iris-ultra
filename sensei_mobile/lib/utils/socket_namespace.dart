/// Maps user roles to the Socket.IO namespace the backend exposes.
String socketNamespaceForRole(String role) {
  switch (role) {
    case 'teacher':
    case 'faculty':
      return '/teacher';
    case 'admin':
      return '/admin';
    default:
      return '/student';
  }
}
