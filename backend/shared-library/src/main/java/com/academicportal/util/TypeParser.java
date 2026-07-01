package com.academicportal.util;

public class TypeParser {
    public static Integer parseInt(Object val) {
        if (val == null) return null;
        if (val instanceof Number) {
            return ((Number) val).intValue();
        }
        String str = val.toString().trim();
        if (str.isEmpty()) return null;
        try {
            return Integer.parseInt(str);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid number format: '" + str + "'");
        }
    }
}
