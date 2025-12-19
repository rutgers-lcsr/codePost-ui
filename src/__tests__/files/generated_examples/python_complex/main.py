import pandas as pd
import requests
import scipy
import numpy as np

def analyze_data():
    df = pd.DataFrame({'a': [1, 2, 3], 'b': [4, 5, 6]})
    print(df.describe())
    
    response = requests.get('https://api.github.com')
    print(response.status_code)

if __name__ == "__main__":
    analyze_data()
