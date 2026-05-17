package com.bicap.auth.service;

import com.bicap.auth.dto.AuthRequest;
import com.bicap.auth.dto.UserProfileRequest;
import com.bicap.auth.model.User;
import com.bicap.auth.model.UserProfile;

public interface IAuthenticationUser {
    /**  
    * Handles the complex logic of user registration, including
    password encoding, role assignment, status setting.
    @param signUpRequest the DTO containing registration data.
    @return the newly created User entity.
    */
   User registerNewUser(AuthRequest authRequest);

   String signIn(AuthRequest authRequest);

   UserProfile updateUserProfile(UserProfileRequest userProfileRequest); 
}
