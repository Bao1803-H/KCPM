# BICAP QA Testing Checklist

## 1. TEST CASES

### Frontend Test Cases

| ID | Scenario | Module | Service | Assignee | Bug Description |
|----|----------|--------|---------|----------|-----------------|
| TC-FE-01 | `frontend_a` | frontend | admin-web | Member 2 | Admin web login page missing CSRF token in form |
| TC-FE-02 | `frontend_b` | frontend | shipping-manager-web | Member 3 | Shipping manager login page missing meta viewport tag |
| TC-FE-03 | `frontend_c` | frontend | guest-web | Member 2/3 | Guest web registration form missing email validation |
| TC-FE-04 | `frontend_d` | frontend | farm-management-web | Member 2/3 | Farm management web dashboard missing translation |
| TC-FE-05 | `frontend_e` | frontend | retailer-web | Member 2/3 | Retailer web product listing page missing pagination |

### Backend Test Cases

| ID | Scenario | Module | Service | Assignee | Bug Description |
|----|----------|--------|---------|----------|-----------------|
| TC-BE-01 | `backend_a` | backend | admin-service | Member 4 | Dashboard stats missing totalWarehouses field |
| TC-BE-02 | `backend_b` | backend | shipping-manager-service | Member 5 | Driver code does not match expected value |
| TC-BE-03 | `backend_c` | backend | auth-service | Member 4/5 | Auth service token refresh endpoint returns 500 |
| TC-BE-04 | `backend_d` | backend | admin-service | Member 4/5 | Admin service user list missing pagination metadata |

---

## 2. LỖI VÀ TEST CASE MỚI

### Lỗi mới - Frontend

| Lỗi ID | Scenario | Error Message | Service | Jira Labels | Assignee |
|---------|----------|---------------|---------|-------------|----------|
| ERR-FE-01 | `frontend_c` | Guest web registration form missing email validation | guest-web | guest-web | Member 2/3 |
| ERR-FE-02 | `frontend_d` | Farm management web dashboard missing translation | farm-management-web | farm-management-web | Member 2/3 |
| ERR-FE-03 | `frontend_e` | Retailer web product listing page missing pagination | retailer-web | retailer-web | Member 2/3 |

### Lỗi mới - Backend

| Lỗi ID | Scenario | Error Message | Service | Jira Labels | Assignee |
|---------|----------|---------------|---------|-------------|----------|
| ERR-BE-01 | `backend_c` | Auth service token refresh endpoint returns 500 | auth-service | auth-service | Member 4/5 |
| ERR-BE-02 | `backend_d` | User list missing pagination metadata | admin-service | admin-service | Member 4/5 |

### Lỗi mới - Infrastructure

| Lỗi ID | Jira | Error Message | Service | Port | Root Cause | Assignee |
|---------|------|---------------|---------|------|------------|----------|
| ERR-INT-01 | KCPM-33 | Wait For Targets - ECONNREFUSED | auth-service | 8088 | Service không accept connections | Member 6 |

---

## 3. TẤT CẢ QA_FAILURE_SCENARIO

| Scenario | Module | Service | Error Description | Assignee |
|----------|--------|---------|-------------------|----------|
| `none` | - | - | Pass (không bug) | - |
| `frontend_a` | frontend | admin-web | Admin login missing CSRF token | Member 2 |
| `frontend_b` | frontend | shipping-manager-web | Shipping login missing viewport | Member 3 |
| `frontend_c` | frontend | guest-web | Guest registration missing email validation | Member 2/3 |
| `frontend_d` | frontend | farm-management-web | Farm dashboard missing translation | Member 2/3 |
| `frontend_e` | frontend | retailer-web | Retailer listing missing pagination | Member 2/3 |
| `backend_a` | backend | admin-service | Dashboard missing totalWarehouses | Member 4 |
| `backend_b` | backend | shipping-manager-service | Driver code mismatch | Member 5 |
| `backend_c` | backend | auth-service | Token refresh returns 500 | Member 4/5 |
| `backend_d` | backend | admin-service | User list missing pagination | Member 4/5 |

---

## 4. HƯỚNG DẪN CHẠY TEST

### TC-FE-01
```
QA_SCOPE = frontend
QA_FAILURE_SCENARIO = frontend_a
```

### TC-FE-02
```
QA_SCOPE = frontend
QA_FAILURE_SCENARIO = frontend_b
```

### TC-FE-03
```
QA_SCOPE = frontend
QA_FAILURE_SCENARIO = frontend_c
```

### TC-FE-04
```
QA_SCOPE = frontend
QA_FAILURE_SCENARIO = frontend_d
```

### TC-FE-05
```
QA_SCOPE = frontend
QA_FAILURE_SCENARIO = frontend_e
```

### TC-BE-01
```
QA_SCOPE = backend
QA_FAILURE_SCENARIO = backend_a
```

### TC-BE-02
```
QA_SCOPE = backend
QA_FAILURE_SCENARIO = backend_b
```

### TC-BE-03
```
QA_SCOPE = backend
QA_FAILURE_SCENARIO = backend_c
```

### TC-BE-04
```
QA_SCOPE = backend
QA_FAILURE_SCENARIO = backend_d
```

---

## 5. SERVICE DETECTION LOGIC

| Error Pattern | Service Detected |
|---------------|------------------|
| "guest" | guest-web |
| "farm" | farm-management-web |
| "admin" + "web" | admin-web |
| "retailer" | retailer-web |
| "shipping" + "manager" | shipping-manager-web |
| "auth" | auth-service |
| "admin" + "service" | admin-service |
| "shipping" + "service" | shipping-manager-service |
| "dashboard" | admin-service |
| "vehicle" | shipping-manager-service |
| "driver" | shipping-manager-service |
| "user" | admin-service |
| "login" / "register" | guest-web |
| "health" | farm-management-web |
| "token" | auth-service |

---

## 6. VERIFICATION CHECKLIST

Sau khi chạy test:

- [ ] Jira bug được tạo
- [ ] Summary đúng format: `[SERVICE] Stage failed`
- [ ] Module đúng: frontend / backend
- [ ] Labels: `automated-bug`, `module-<service>`, `qa-fix`
- [ ] Assignee đúng thành viên
- [ ] Suggested fix branch đúng format
- [ ] Error details có trong description
