package com.bicap.auth.service;

import java.util.Optional;

import com.bicap.auth.model.User;
import com.bicap.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    @Autowired
    UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Try email first (since login uses email), then username
        Optional<User> userOpt = userRepository.findByEmail(username);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByUsername(username);
        }
        if (userOpt.isEmpty()) {
            // Fallback to findByUsernameOrEmail but get first result (handles duplicates)
            userOpt = userRepository.findByUsernameOrEmail(username, username);
        }
        
        User user = userOpt
                .orElseThrow(() -> new UsernameNotFoundException("User Not Found with username or email: " + username));

        return UserDetailsImpl.build(user);
    }
}
