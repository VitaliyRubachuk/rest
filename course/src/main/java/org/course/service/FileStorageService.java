package org.course.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Logger logger = LoggerFactory.getLogger(FileStorageService.class);
    private final Path fileStorageLocation;
    private final String fileStorageUrlPrefix;

    public FileStorageService(@Value("${file.upload-dir}") String uploadDir,
                              @Value("${file.url-prefix}") String urlPrefix) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.fileStorageUrlPrefix = urlPrefix;
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            logger.error("Не вдалося створити директорію для завантажених файлів.", ex);
            throw new RuntimeException("Не вдалося створити директорію для завантажених файлів.", ex);
        }
    }

    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            logger.warn("Спроба зберегти порожній файл.");
            return null;
        }

        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        String fileExtension = "";
        try {
            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }
        } catch (Exception e) {
            logger.warn("Не вдалося визначити розширення файлу: {}", originalFileName);
        }

        String storedFileName = UUID.randomUUID().toString() + fileExtension;

        try {
            if (storedFileName.contains("..")) {
                logger.error("Ім'я файлу містить некоректну послідовність: {}", storedFileName);
                throw new RuntimeException("Вибачте! Ім'я файлу містить некоректну послідовність " + storedFileName);
            }

            Path targetLocation = this.fileStorageLocation.resolve(storedFileName);
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            }

            logger.info("Збережено файл {} як {}", originalFileName, storedFileName);
            return this.fileStorageUrlPrefix + "/" + storedFileName;
        } catch (IOException ex) {
            logger.error("Не вдалося зберегти файл {}. Будь ласка, спробуйте ще раз!", originalFileName, ex);
            throw new RuntimeException("Не вдалося зберегти файл " + originalFileName + ". Будь ласка, спробуйте ще раз!", ex);
        }
    }

    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank() || !fileUrl.startsWith(this.fileStorageUrlPrefix)) {
            logger.warn("Некоректний або порожній URL для видалення файлу: {}", fileUrl);
            return;
        }
        try {
            String fileName = fileUrl.substring(this.fileStorageUrlPrefix.length() + 1);
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                logger.info("Файл успішно видалено: {}", fileName);
            } else {
                logger.warn("Файл для видалення не знайдено: {}", fileName);
            }
        } catch (IOException ex) {
            logger.error("Не вдалося видалити файл: {}", fileUrl, ex);
        }
    }
}