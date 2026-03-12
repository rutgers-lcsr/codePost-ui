// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.List;

public class Main {
    public static List<Integer> parseNumbers(String csvLine) {
        // TODO(student): Parse comma-separated integers.
        return Collections.emptyList();
    }

    public static void main(String[] args) throws IOException {
        String csv = Files.readString(Path.of("shared/existing_data.txt")).trim();
        List<Integer> values = parseNumbers(csv);

        Files.writeString(Path.of("starter_output.txt"), "TODO count=" + values.size());

        assert !values.isEmpty() : "Starter assertion intentionally triggers until parseNumbers is implemented.";
        System.out.println("Starter template ran.");
    }
}
