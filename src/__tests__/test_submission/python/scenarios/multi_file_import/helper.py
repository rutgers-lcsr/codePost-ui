def parse_and_sum(csv: str) -> int:
    return sum(int(value.strip()) for value in csv.split(","))
