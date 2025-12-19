library(ggplot2)
library(dplyr)

data(mtcars)
summary(mtcars)

p <- ggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()
print(p)
