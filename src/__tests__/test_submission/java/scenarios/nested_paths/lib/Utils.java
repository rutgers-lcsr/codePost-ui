package __tests__.test_submission.java.scenarios.nested_paths.lib;

import java.util.Arrays;

public class Utils {
    public static int[] parse(String csv) {
        return Arrays.stream(csv.split(",")).map(String::trim).mapToInt(Integer::parseInt).toArray();
    }
}
