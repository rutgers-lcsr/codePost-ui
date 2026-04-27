import java.util.*;
import java.util.stream.Collectors;

/**
 * Sample Java file — generic BST with traversals.
 */
public class Main {

    static class BST<T extends Comparable<T>> {
        private T value;
        private BST<T> left, right;

        BST(T value) {
            this.value = value;
        }

        void insert(T item) {
            if (item.compareTo(value) < 0) {
                if (left == null)
                    left = new BST<>(item);
                else
                    left.insert(item);
            } else {
                if (right == null)
                    right = new BST<>(item);
                else
                    right.insert(item);
            }
        }

        List<T> inOrder() {
            List<T> result = new ArrayList<>();
            if (left != null)
                result.addAll(left.inOrder());
            result.add(value);
            if (right != null)
                result.addAll(right.inOrder());
            return result;
        }

        Optional<T> find(T target) {
            int cmp = target.compareTo(value);
            if (cmp == 0)
                return Optional.of(value);
            if (cmp < 0 && left != null)
                return left.find(target);
            if (cmp > 0 && right != null)
                return right.find(target);
            return Optional.empty();
        }
    }

    public static void main(String[] args) {
        BST<Integer> tree = new BST<>(50);
        int[] values = { 30, 70, 20, 40, 60, 80, 10, 25, 35, 45 };
        for (int v : values)
            tree.insert(v);

        String sorted = tree.inOrder().stream()
                .map(String::valueOf)
                .collect(Collectors.joining(", "));
        System.out.println("In-order: " + sorted);

        System.out.println("Find 40: " + tree.find(40).orElse(-1));
        System.out.println("Find 99: " + tree.find(99).orElse(-1));
    }
}
