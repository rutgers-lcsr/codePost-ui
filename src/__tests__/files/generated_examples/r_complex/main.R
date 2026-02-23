# Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
library(ggplot2)
library(dplyr)

data(mtcars)
summary(mtcars)

p <- ggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()
print(p)
