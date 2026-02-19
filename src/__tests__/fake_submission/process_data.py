import numpy as np
import pandas as pd


def read_data():    
    return pd.read_csv("/srv/shared/data.csv")


def is_there_more_comedy_than_drama():
    data = read_data()
    # get the number of Comedy movies
    comedy_count = data[data['genre'] == 'Comedy'].shape[0]

    # get the number of Drama movies
    drama_count = data[data['genre'] == 'Drama'].shape[0]

    return comedy_count > drama_count


# Do some data analysis
def is_comedy_more_likely_than_drama_given_rating_8():
    data = read_data()

    # whats the likelihood of a movie being comedy given it has a rating of 8?
    comedy_count = data[(data['genre'] == 'Comedy') & (data['rating'] == 8)].shape[0]
    total_count = data[data['rating'] == 8].shape[0]
    return comedy_count / total_count


def run_data_analysis():
    print(is_there_more_comedy_than_drama())
    print(f"The likelihood of a movie being comedy given it has a rating of 8 is {is_comedy_more_likely_than_drama_given_rating_8()}")


def test_numpy_array():
    arr = np.array([1, 2, 3])
    assert arr.sum() == 6
    assert arr.mean() == 2   
    assert arr.std() == np.std([1, 2, 3])
    
if __name__ == "__main__":
    run_data_analysis()
    test_numpy_array()
    print("Numpy array tests passed.")