package __tests__.test_submission.java.scenarios.nested_paths.src;

import __tests__.test_submission.java.scenarios.nested_paths.lib.Utils;

public class Main {
    public static void main(String[] args) {
        int[] values = Utils.parse("1,2,3,4");
        if (values.length != 4) {
            throw new AssertionError("Expected 4 values");
        }
        System.out.println("[java][nested_paths] count=" + values.length);
    }
}
