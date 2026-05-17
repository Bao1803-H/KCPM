package com.bicap.auth.config;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Component
public class StorageConfig implements InitializingBean {

    @Value("${storage.upload-dir}")
    private String uploadDir;

    @Override
    public void afterPropertiesSet() throws Exception {
        Path path = Paths.get(uploadDir);
        Files.createDirectories(path);
    }
}
