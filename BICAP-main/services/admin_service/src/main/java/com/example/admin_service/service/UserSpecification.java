package com.example.admin_service.service;

import com.example.admin_service.entity.User;
import com.example.admin_service.enums.ERole;
import jakarta.persistence.criteria.Join;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

public class UserSpecification {

    public static Specification<User> filterUsers(String keyword, String roleName) {
        return (root, query, criteriaBuilder) -> {
            Specification<User> spec = Specification.where(null);

            // 1. Lọc theo Keyword (tìm trong username hoặc email)
            if (StringUtils.hasText(keyword)) {
                String pattern = "%" + keyword.toLowerCase() + "%";
                Specification<User> nameLike = (r, q, cb) -> cb.like(cb.lower(r.get("username")), pattern);
                Specification<User> emailLike = (r, q, cb) -> cb.like(cb.lower(r.get("email")), pattern);
                spec = spec.and(nameLike.or(emailLike));
            }

            // 2. Lọc theo Role (Quan hệ Many-to-Many)
            if (StringUtils.hasText(roleName)) {
                Specification<User> hasRole = (r, q, cb) -> {
                    Join<Object, Object> roles = r.join("roles");
                    return cb.equal(roles.get("name"), ERole.valueOf(roleName));
                };
                spec = spec.and(hasRole);
            }
            return spec.toPredicate(root, query, criteriaBuilder);
        };
    }
}