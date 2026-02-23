# Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
library(tidyverse)
library(tidytext)
library(pdftools)
library(tools)
library(tesseract)
library(parallel)
library(stringr)
pdfs_df <- read.csv('~/shared/docs.csv')

all_text <- pdfs_df |>
  unnest_tokens(input = extracted_text, output = word) |>
  anti_join(stop_words) |>
  filter(grepl(word, pattern = "^[a-z]")) |>
  group_by(abode_id, doc_title, word) |>
  count(abode_id, doc_title, word, sort = TRUE) |>
  filter(str_length(word) > 5 & str_detect(word, negate = TRUE, pattern = "approved|release|cia")) |>
  summarise(occuranstces = sum(n))

germany_docs <- all_text |>
  filter(str_detect(word, "germany"))

greece_docs <- all_text |>
  filter(str_detect(word, "greece"))

finland_docs <- all_text |>
  filter(str_detect(word, "finland"))

israel_docs <- all_text |>
  filter(str_detect(word, "israel"))

france_docs <- all_text |>
  filter(str_detect(word, "france"))

china_docs <- all_text |>
  filter(str_detect(word, "china"))

india_docs <- all_text |>
  filter(str_detect(word, "india"))

poland_docs <- all_text |>
  filter(str_detect(word, "poland"))

irish_docs <- all_text |>
  filter(str_detect(word, "ireland"))

iran_docs <- all_text |>
  filter(str_detect(word, "iran"))

ggplot(data=germany_docs,aes(x=word)) +
  geom_histogram(stat='count') +
  theme_classic()

ggplot(data=greece_docs,aes(x=word)) +
  geom_histogram(stat='count') +
  theme_classic()

ggplot(data=israel_docs,aes(x=word)) +
  geom_histogram(stat='count') +
  theme_classic()

ggplot(data=france_docs,aes(x=word)) +
  geom_histogram(stat='count') +
  theme_classic()
  
 
  
