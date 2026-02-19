package __tests__.test_submission.java.scenarios.multi_file_import;

import java.util.List;

public class Main {
    public static void main(String[] args) {
        int sum = Helper.parseAndSum("3,5,8,13,21");
        if (sum != 50) {
            throw new AssertionError("Expected 50");
        }
        System.out.println("[java][multi_file_import] sum=" + sum);
        List<Integer> values = Helper.parse("1,2,3");
        if (values.size() != 3) {
            throw new AssertionError("Expected 3 values");
        }
    }
}
