package com.bicap.auth.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bicap.auth.model.User;
import com.bicap.auth.model.UserProfile;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long>{
    Optional<UserProfile> findByUser(User user);
}
