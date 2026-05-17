package com.example.admin_service.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Converter
public class StringListConverter implements AttributeConverter<List<String>, String> {

    private static final String SPLIT_CHAR = ",";

    @Override
    public String convertToDatabaseColumn(List<String> stringList) {
        if (stringList == null || stringList.isEmpty()) {
            return null;
        }
        return stringList.stream()
                .map(s -> s.replace(SPLIT_CHAR, "\\" + SPLIT_CHAR)) // Escape the split character if present in a string
                .collect(Collectors.joining(SPLIT_CHAR));
    }

    @Override
    public List<String> convertToEntityAttribute(String string) {
        if (string == null || string.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return Arrays.stream(string.split(SPLIT_CHAR))
                .map(s -> s.replace("\\" + SPLIT_CHAR, SPLIT_CHAR)) // Unescape the split character
                .collect(Collectors.toList());
    }
}
