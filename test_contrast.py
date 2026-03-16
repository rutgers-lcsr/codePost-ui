def luminance(hex_color):
    hex_color = hex_color.lstrip('#')
    rgb = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    a = []
    for v in rgb:
        v /= 255.0
        a.append(v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4)
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722

def contrast(hex1, hex2):
    lum1 = luminance(hex1)
    lum2 = luminance(hex2)
    brightest = max(lum1, lum2)
    darkest = min(lum1, lum2)
    return (brightest + 0.05) / (darkest + 0.05)

print(f"0050b3 / f2f2f2: {contrast('0050b3', 'f2f2f2')}")
print(f"003a8c / f2f2f2: {contrast('003a8c', 'f2f2f2')}")
