// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
package __tests__.test_submission.java.scenarios.nested_paths.lib;

import java.util.Arrays;

public class Utils {
    public static int[] parse(String csv) {
        return Arrays.stream(csv.split(",")).map(String::trim).mapToInt(Integer::parseInt).toArray();
    }
}
