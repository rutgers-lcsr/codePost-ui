#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct Node {
    int data;
    struct Node *next;
} Node;

typedef struct {
    Node *head;
    size_t length;
} LinkedList;

LinkedList *list_create(void) {
    LinkedList *list = malloc(sizeof(LinkedList));
    if (!list) return NULL;
    list->head = NULL;
    list->length = 0;
    return list;
}

int list_push(LinkedList *list, int value) {
    Node *node = malloc(sizeof(Node));
    if (!node) return -1;
    node->data = value;
    node->next = list->head;
    list->head = node;
    list->length++;
    return 0;
}

Node *list_find(LinkedList *list, int value) {
    for (Node *cur = list->head; cur; cur = cur->next) {
        if (cur->data == value) return cur;
    }
    return NULL;
}

void list_reverse(LinkedList *list) {
    Node *prev = NULL, *cur = list->head, *next;
    while (cur) {
        next = cur->next;
        cur->next = prev;
        prev = cur;
        cur = next;
    }
    list->head = prev;
}

void list_print(LinkedList *list) {
    printf("[");
    for (Node *cur = list->head; cur; cur = cur->next) {
        printf("%d%s", cur->data, cur->next ? ", " : "");
    }
    printf("] (length: %zu)\n", list->length);
}

void list_free(LinkedList *list) {
    Node *cur = list->head;
    while (cur) {
        Node *tmp = cur;
        cur = cur->next;
        free(tmp);
    }
    free(list);
}

int main(void) {
    LinkedList *list = list_create();
    for (int i = 1; i <= 10; i++) list_push(list, i);

    printf("Original:  "); list_print(list);
    list_reverse(list);
    printf("Reversed:  "); list_print(list);

    int target = 5;
    Node *found = list_find(list, target);
    printf("Find %d:    %s\n", target, found ? "found" : "not found");

    list_free(list);
    return 0;
}
