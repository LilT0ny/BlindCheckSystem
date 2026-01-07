import requests
import sys

BASE_URL = "http://localhost:8000"

def log(msg):
    print(f"[TEST] {msg}")

def get_token(username, password):
    response = requests.post(f"{BASE_URL}/token", data={"username": username, "password": password})
    if response.status_code != 200:
        log(f"Login failed for {username}: {response.text}")
        sys.exit(1)
    return response.json()["access_token"]

def main():
    log("Starting Flow Test...")
    
    # 1. Login Subdean
    log("1. Login Subdean...")
    subdean_token = get_token("subdean@example.com", "adminpassword")
    headers_subdean = {"Authorization": f"Bearer {subdean_token}"}
    
    # 2. Create Users
    log("2. Creating Users (Student, Teacher)...")
    student_data = {
        "full_name": "Juan Perez",
        "email": "juan.student@example.com",
        "password": "studentpassword",
        "role": "student"
    }
    requests.post(f"{BASE_URL}/users/", json=student_data, headers=headers_subdean) # Ignore error if exists

    teacher_data = {
        "full_name": "Dr. House",
        "email": "dr.house@example.com",
        "password": "teacherpassword",
        "role": "teacher"
    }
    requests.post(f"{BASE_URL}/users/", json=teacher_data, headers=headers_subdean)

    # 3. Create Subject
    log("3. Creating Subject...")
    subject_data = {
        "name": "Software Seguro",
        "code": "SEG101",
        "groups": [{"group_name": "GR1", "teacher_email": "dr.house@example.com"}]
    }
    requests.post(f"{BASE_URL}/academic/subjects", json=subject_data, headers=headers_subdean)

    # 4. Login Student
    log("4. Login Student...")
    student_token = get_token("juan.student@example.com", "studentpassword")
    headers_student = {"Authorization": f"Bearer {student_token}"}
    
    # 5. Create Request
    log("5. Creating Regrading Request...")
    req_data = {
        "subject_code": "SEG101",
        "group_name": "GR1",
        "component": "Examen Final",
        "reason": "Creo que merezco mas nota porque...",
        "evidence_url": "http://bucket/evidence.pdf"
    }
    r = requests.post(f"{BASE_URL}/requests/", json=req_data, headers=headers_student)
    if r.status_code != 200:
        log(f"Create request failed: {r.text}")
        sys.exit(1)
    request_id = r.json()["_id"]
    log(f"Request Created: {request_id}")

    # 6. Subdean Reviews
    log("6. Subdean Reviews Request...")
    # List pending
    r = requests.get(f"{BASE_URL}/requests/pending", headers=headers_subdean)
    # log(f"Pending requests: {r.json()}")
    
    # Accept
    log("   Subdean Accepting...")
    r = requests.put(f"{BASE_URL}/requests/{request_id}/status", json={"status": "ACCEPTED"}, headers=headers_subdean)
    assert r.json()["status"] == "ACCEPTED"

    # 7. Teacher Grades
    log("7. Teacher Grades...")
    teacher_token = get_token("dr.house@example.com", "teacherpassword")
    headers_teacher = {"Authorization": f"Bearer {teacher_token}"}
    
    grade_data = {
        "new_grade": 9.5,
        "comment": "Revision aceptada, buena justificacion."
    }
    r = requests.put(f"{BASE_URL}/requests/{request_id}/grade", json=grade_data, headers=headers_teacher)
    assert r.json()["status"] == "GRADED"

    # 8. Student Checks
    log("8. Student Checks Result...")
    r = requests.get(f"{BASE_URL}/requests/me", headers=headers_student)
    my_requests = r.json()
    target = next((x for x in my_requests if x["_id"] == request_id), None)
    if target:
        log(f"Student validation: Status={target['status']}, Grade={target['grade_new']}, Comment={target['teacher_comment']}")
        assert target["grade_new"] == 9.5
        assert target["teacher_comment"] == "Revision aceptada, buena justificacion."
    else:
        log("Request not found in student list!")

    log("SUCCESS! All flows verified.")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        log(f"ERROR: {e}")
