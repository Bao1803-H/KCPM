# BICAP QA Testing Checklist

## 1. TEST CASES - CÓ THỂ TEST QUA JENKINS

### Frontend Test Cases

| ID | Scenario | Module | Service | Assignee | Bug Description |
|----|----------|--------|---------|----------|-----------------|
| TC-FE-01 | `frontend_a` | frontend | admin-web | Member 2 - Frontend Developer A | Admin web login page missing CSRF token in form |
| TC-FE-02 | `frontend_b` | frontend | shipping-manager-web | Member 3 - Frontend Developer B | Shipping manager login page missing required meta viewport tag |

### Backend Test Cases

| ID | Scenario | Module | Service | Assignee | Bug Description |
|----|----------|--------|---------|----------|-----------------|
| TC-BE-01 | `backend_a` | backend | admin-service | Member 4 - Backend Developer A | Dashboard stats missing totalWarehouses field |
| TC-BE-02 | `backend_b` | backend | shipping-manager-service | Member 5 - Backend Developer B | Driver code does not match expected QA-EXPECTED-DRIVER-CODE |

---

## 2. CÁCH CHẠY TEST

### QA_SCOPE Options

| Scope | Description |
|-------|-------------|
| `all` | Test toàn bộ (frontend + backend) |
| `frontend` | Test frontend only |
| `backend` | Test backend only |
| `integration` | Test integration (giống all) |
| `infra` | Chỉ kiểm tra infrastructure |

### QA_FAILURE_SCENARIO Options

| Scenario | Kết quả |
|----------|---------|
| `none` | Test pass (không có bug) |
| `frontend_a` | Bug: admin-web |
| `frontend_b` | Bug: shipping-manager-web |
| `backend_a` | Bug: admin-service |
| `backend_b` | Bug: shipping-manager-service |

---

## 3. HƯỚNG DẪN CHẠY

### Test TC-FE-01: Admin Web Bug
```
1. Jenkins → BICAP-Pipeline → Build with Parameters
2. QA_SCOPE = frontend
3. QA_FAILURE_SCENARIO = frontend_a
4. Build
```

### Test TC-FE-02: Shipping Manager Web Bug
```
1. Jenkins → BICAP-Pipeline → Build with Parameters
2. QA_SCOPE = frontend
3. QA_FAILURE_SCENARIO = frontend_b
4. Build
```

### Test TC-BE-01: Admin Service Bug
```
1. Jenkins → BICAP-Pipeline → Build with Parameters
2. QA_SCOPE = backend
3. QA_FAILURE_SCENARIO = backend_a
4. Build
```

### Test TC-BE-02: Shipping Manager Service Bug
```
1. Jenkins → BICAP-Pipeline → Build with Parameters
2. QA_SCOPE = backend
3. QA_FAILURE_SCENARIO = backend_b
4. Build
```

---

## 4. KẾT QUẢ MONG ĐỢI

### Jira Bug Fields

| Field | Expected Value |
|-------|----------------|
| Summary | `[<SERVICE_NAME>] <STAGE_NAME> failed` |
| Module | frontend / backend |
| Labels | `automated-bug`, `module-<service>`, `qa-fix` |
| Assignee | Đúng thành viên |
| Branch | `bugfix/<module>/<JIRA-KEY>-<description>` |

### Expected Assignees

| Test Case | Assignee |
|-----------|----------|
| frontend_a | Member 2 - Frontend Developer A |
| frontend_b | Member 3 - Frontend Developer B |
| backend_a | Member 4 - Backend Developer A |
| backend_b | Member 5 - Backend Developer B |

---

## 5. VERIFICATION CHECKLIST

Sau khi chạy test, kiểm tra:

- [ ] Jira bug được tạo
- [ ] Summary đúng format: `[SERVICE] Stage failed`
- [ ] Module đúng: frontend / backend
- [ ] Labels đầy đủ: `automated-bug`, `module-<service>`, `qa-fix`
- [ ] Assignee đúng thành viên
- [ ] Suggested fix branch đúng format
- [ ] Error details có trong description
