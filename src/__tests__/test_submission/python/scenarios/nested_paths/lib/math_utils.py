def parse_csv(csv: str) -> list[int]:
    return [int(value.strip()) for value in csv.split(",")]
