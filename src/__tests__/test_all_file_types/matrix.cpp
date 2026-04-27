#include <iostream>
#include <vector>
#include <stdexcept>
#include <iomanip>

template <typename T>
class Matrix {
    std::vector<std::vector<T>> data_;
    size_t rows_, cols_;

public:
    Matrix(size_t rows, size_t cols, T fill = T{})
        : data_(rows, std::vector<T>(cols, fill)), rows_(rows), cols_(cols) {}

    size_t rows() const { return rows_; }
    size_t cols() const { return cols_; }

    T& operator()(size_t r, size_t c) { return data_.at(r).at(c); }
    const T& operator()(size_t r, size_t c) const { return data_.at(r).at(c); }

    Matrix operator*(const Matrix& other) const {
        if (cols_ != other.rows_)
            throw std::invalid_argument("Dimension mismatch for multiplication");
        Matrix result(rows_, other.cols_);
        for (size_t i = 0; i < rows_; ++i)
            for (size_t j = 0; j < other.cols_; ++j)
                for (size_t k = 0; k < cols_; ++k)
                    result(i, j) += data_[i][k] * other(k, j);
        return result;
    }

    Matrix transpose() const {
        Matrix result(cols_, rows_);
        for (size_t i = 0; i < rows_; ++i)
            for (size_t j = 0; j < cols_; ++j)
                result(j, i) = data_[i][j];
        return result;
    }

    friend std::ostream& operator<<(std::ostream& os, const Matrix& m) {
        for (size_t i = 0; i < m.rows_; ++i) {
            for (size_t j = 0; j < m.cols_; ++j)
                os << std::setw(6) << m(i, j);
            os << '\n';
        }
        return os;
    }
};

int main() {
    Matrix<int> a(2, 3);
    int val = 1;
    for (size_t i = 0; i < a.rows(); ++i)
        for (size_t j = 0; j < a.cols(); ++j)
            a(i, j) = val++;

    std::cout << "A:\n" << a;
    std::cout << "\nA^T:\n" << a.transpose();
    std::cout << "\nA * A^T:\n" << a * a.transpose();
}
