import numpy as np




def test_numpy_array():
    arr = np.array([1, 2, 3])
    assert arr.sum() == 6
    assert arr.mean() == 2   
    assert arr.std() == np.std([1, 2, 3])
    
if __name__ == "__main__":
    test_numpy_array()
    print("Numpy array tests passed.")