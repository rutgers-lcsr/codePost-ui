package __tests__.test_submission.java.scenarios.multi_file_import;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class Helper {
    public static List<Integer> parse(String csv) {
        return Arrays.stream(csv.split(",")).map(String::trim).map(Integer::parseInt).collect(Collectors.toList());
    }

    public static int parseAndSum(String csv) {
        return parse(csv).stream().mapToInt(Integer::intValue).sum();
    }
}
