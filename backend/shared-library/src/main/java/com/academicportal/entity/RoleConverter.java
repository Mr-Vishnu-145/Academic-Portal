package com.academicportal.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class RoleConverter implements AttributeConverter<Role, Integer> {

    @Override
    public Integer convertToDatabaseColumn(Role role) {
        if (role == null) {
            return null;
        }
        switch (role) {
            case STUDENT: return 1;
            case STAFF: return 2;
            case HOD: return 3;
            case ADMIN: return 4;
            default: throw new IllegalArgumentException("Unknown role: " + role);
        }
    }

    @Override
    public Role convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        switch (dbData) {
            case 1: return Role.STUDENT;
            case 2: return Role.STAFF;
            case 3: return Role.HOD;
            case 4: return Role.ADMIN;
            default: throw new IllegalArgumentException("Unknown role ID: " + dbData);
        }
    }
}
