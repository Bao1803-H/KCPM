package com.bicap.auth.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.bicap.auth.model.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    // Find by username OR email - returns first match to avoid "non-unique result" error
    @Query("SELECT u FROM User u WHERE u.username = :identifier OR u.email = :identifier")
    List<User> findByUsernameOrEmailList(@Param("identifier") String identifier);
    
    // Default method to get first result or empty
    default Optional<User> findByUsernameOrEmail(String username, String email) {
        List<User> users = findByUsernameOrEmailList(username);
        if (users.isEmpty()) {
            users = findByUsernameOrEmailList(email);
        }
        return users.stream().findFirst();
    }
}
