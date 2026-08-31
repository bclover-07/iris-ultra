const HEADER_MAPPINGS = {
  'student_id': 'studentId', 'studentid': 'studentId', 'student id': 'studentId',
  'roll_no': 'studentId', 'rollno': 'studentId', 'roll no': 'studentId',
  'roll_number': 'studentId', 'enrollment': 'studentId', 'enrollment_no': 'studentId',
  'name': 'name', 'student_name': 'name', 'student name': 'name', 'full_name': 'name',
  'subject': 'subject', 'subject_name': 'subject', 'course': 'subject',
  'ut1': 'ut1', 'ut_1': 'ut1', 'unit_test_1': 'ut1', 'test_1': 'ut1', 'cat1': 'ut1',
  'ut2': 'ut2', 'ut_2': 'ut2', 'unit_test_2': 'ut2', 'test_2': 'ut2', 'cat2': 'ut2',
  'midsem': 'midSem', 'mid_sem': 'midSem', 'mid': 'midSem', 'midterm': 'midSem',
  'mid_semester': 'midSem', 'mst': 'midSem',
  'endsem': 'endSem', 'end_sem': 'endSem', 'final': 'endSem', 'end_semester': 'endSem',
  'ese': 'endSem', 'end': 'endSem',
  'total': 'total', 'total_marks': 'total',
  'percentage': 'percentage', 'percent': 'percentage', '%': 'percentage',
  'attendance': 'attendancePercentage', 'attendance_percentage': 'attendancePercentage',
  'attended': 'attended', 'classes_attended': 'attended', 'present': 'attended',
  'total_classes': 'totalClasses', 'total_lectures': 'totalClasses', 'conducted': 'totalClasses',
  'department': 'department', 'dept': 'department', 'branch': 'department',
  'semester': 'semester', 'sem': 'semester',
};

export const normalizeHeaders = (headers) => {
  return headers.map((header) => {
    const normalized = header.toLowerCase().trim().replace(/[^a-z0-9_% ]/g, '');
    return HEADER_MAPPINGS[normalized] || header;
  });
};

export const normalizeRow = (row, normalizedHeaders) => {
  const normalized = {};
  const keys = Object.keys(row);
  
  keys.forEach((key, index) => {
    const mappedKey = normalizedHeaders[index] || key;
    let value = row[key];
    
    if (typeof value === 'string') {
      value = value.trim();
    }
    
    const numericFields = ['ut1', 'ut2', 'midSem', 'endSem', 'total', 'percentage',
      'attendancePercentage', 'attended', 'totalClasses', 'semester'];
    if (numericFields.includes(mappedKey) && value !== '' && value !== undefined) {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) value = parsed;
    }
    
    normalized[mappedKey] = value;
  });

  return normalized;
};

export const validateRow = (row, index) => {
  const errors = [];
  if (!row.studentId && !row.name) {
    errors.push({ row: index + 1, message: 'Missing student identifier (studentId or name)' });
  }
  return errors;
};

export default { normalizeHeaders, normalizeRow, validateRow };
