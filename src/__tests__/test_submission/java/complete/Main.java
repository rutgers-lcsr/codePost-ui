import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class Main {
    private static List<Integer> parseNumbers(String csvLine) {
        return Arrays.stream(csvLine.split(","))
                .map(String::trim)
                .map(Integer::parseInt)
                .collect(Collectors.toList());
    }

    private static void assertCondition(boolean condition, String message) {
        if (!condition) {
            throw new AssertionError(message);
        }
    }

    public static void main(String[] args) throws IOException {
        String csv = Files.readString(Path.of("../existing_data.txt")).trim();
        List<Integer> values = parseNumbers(csv);

        int sum = values.stream().mapToInt(Integer::intValue).sum();
        int max = values.stream().mapToInt(Integer::intValue).max().orElseThrow();

        String report = "count=" + values.size() + System.lineSeparator()
                + "sum=" + sum + System.lineSeparator()
                + "max=" + max + System.lineSeparator();
        Files.writeString(Path.of("result_summary.txt"), report);

        StringBuilder markdown = new StringBuilder();
        markdown.append("# Java Rendering Preview").append(System.lineSeparator()).append(System.lineSeparator());
        markdown.append("- Unicode: café λ 🚀").append(System.lineSeparator());
        markdown.append("- Status: success").append(System.lineSeparator()).append(System.lineSeparator());
        markdown.append("```text").append(System.lineSeparator());
        markdown.append("idx | value").append(System.lineSeparator());
        markdown.append("-----------").append(System.lineSeparator());
        for (int i = 0; i < values.size(); i++) {
            markdown.append(i).append("   | ").append(values.get(i)).append(System.lineSeparator());
        }
        markdown.append("```").append(System.lineSeparator());
        Files.writeString(Path.of("render_preview.md"), markdown.toString());

        assertCondition(values.size() == 5, "Expected five values.");
        assertCondition(sum == 50, "Expected sum to equal 50.");
        assertCondition(max == 21, "Expected max to equal 21.");

        System.out.println("=== JAVA RENDER TEST START ===");
        System.out.println("unicode: café λ 🚀");
        System.out.println("json: {\"language\":\"java\",\"status\":\"ok\"}");
        System.out.println("idx | value");
        for (int i = 0; i < values.size(); i++) {
            System.out.println(String.format("%3d | %d", i, values.get(i)));
        }
        System.err.println("[stderr][java] Render check stderr line");
        System.out.println("Java compatibility checks passed.");
    }
}
