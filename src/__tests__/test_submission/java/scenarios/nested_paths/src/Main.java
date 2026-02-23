// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
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
