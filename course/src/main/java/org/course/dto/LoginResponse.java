package org.course.dto;

public class LoginResponse {
    private long id;
    private String email;
    private String role;

    public LoginResponse(long id, String email, String role) {
        this.id = id;
        this.email = email;
        this.role = role;
    }

    public long getId() { return id; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
}
