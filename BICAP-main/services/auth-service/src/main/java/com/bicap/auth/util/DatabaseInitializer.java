package com.bicap.auth.util;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.bicap.auth.model.ERole;
import com.bicap.auth.model.Role;
import com.bicap.auth.repository.RoleRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DatabaseInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;

    @Override
    public void run(String... args) throws Exception {
        if (roleRepository.count() == 0) {
            for (ERole roleName : ERole.values()) {
                Role role = new Role();
                role.setName(roleName);
                roleRepository.save(role);
            }
        }
    }
}
