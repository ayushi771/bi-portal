from fastapi import APIRouter, Query
import psycopg2

router = APIRouter()

def get_connection():
    return psycopg2.connect(
        host="localhost",
        database="herodb",
        user="postgres",
        password="ayushi"
    )

@router.get("/ai-insights/employees")
def employee_ai_insights(question: str = Query(...)):

    conn = get_connection()
    cur = conn.cursor()

    q = question.lower()

    if "total" in q and "employee" in q:
        cur.execute('SELECT COUNT(*) FROM employee')
        total = cur.fetchone()[0]
        answer = f"There are {total} employees in the organization."

    elif "average salary" in q or "salary" in q:
        cur.execute('SELECT AVG("Salary_INR") FROM employee')
        avg = cur.fetchone()[0] or 0
        answer = f"The average salary is ₹{round(avg, 2)}."

    elif "department" in q and ("top" in q or "highest" in q or "most" in q):
        cur.execute('''
            SELECT "Department", COUNT(*)
            FROM employee
            GROUP BY "Department"
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ''')
        dept = cur.fetchone()[0]
        answer = f"{dept} has the highest number of employees."

    elif "experience" in q:
        cur.execute('SELECT AVG("Experience_Years") FROM employee')
        exp = cur.fetchone()[0] or 0
        answer = f"Average experience is {round(exp, 2)} years."

    elif "active" in q:
        cur.execute('''
            SELECT COUNT(*) FROM employee
            WHERE "Status" = 'Active'
        ''')
        active = cur.fetchone()[0]
        answer = f"There are {active} active employees."

    else:
        answer = "I couldn’t understand the question. Try asking about employees, salary, department, or experience."

    cur.close()
    conn.close()

    return {"answer": answer}