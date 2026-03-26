package com.legendss.backend.services;

import com.legendss.backend.entities.UserProfile;
import com.legendss.backend.repositories.UserProfileRepository;
import org.springframework.stereotype.Service;


import java.util.Optional;

@Service
public class UserProfileService {
    private final UserProfileRepository userProfileRepository;

    public UserProfileService(UserProfileRepository userProfileRepository){
        this.userProfileRepository = userProfileRepository;
    }

    public UserProfile addUserProfile(UserProfile userProfile){
        return this.userProfileRepository.save(userProfile);
    }

    public UserProfile getUserProfile(Long id) {
        Optional<UserProfile> userProfileToGet = this.userProfileRepository.findById(id);
        if(userProfileToGet.isEmpty()){
            return null;
        }
        return userProfileToGet.get();
    }
    public UserProfile updateUserProfile(UserProfile userProfile){
        UserProfile userProfileToUpdate = this.getUserProfile(userProfile.getId());
        if(userProfileToUpdate == null){
            return null;
        }
        if(userProfile.getAddress() != null){
            userProfileToUpdate.setAddress(userProfile.getAddress());
        }
        if(userProfile.getTelephone() != null){
            userProfileToUpdate.setTelephone(userProfile.getTelephone());
        }
        if(userProfile.getTheme()!= null){
            userProfileToUpdate.setTheme(userProfile.getTheme());
        }
        if(userProfile.getPhoto()!= null){
            userProfileToUpdate.setPhoto(userProfile.getPhoto());
        }
        return this.userProfileRepository.save(userProfileToUpdate);
    }

    public void deleteUserProfile(long id){
        this.userProfileRepository.deleteById(id);
    }
}
