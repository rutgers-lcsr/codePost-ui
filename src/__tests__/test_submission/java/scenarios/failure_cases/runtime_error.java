package __tests__.test_submission.java.scenarios.failure_cases;

public class runtime_error {
    public static void main(String[] args) {
        throw new RuntimeException("Intentional runtime error for submission-process testing");
    }
}
