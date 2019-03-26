/******************************************************************************
 *  Student: <email here>
 *  Section: P07
 *
 *  Partner <partner here>
 *  Partner section: N/A
 *
 *  Description:  Includes a utility functions for working with int arrays.
 *  Implemented using recursion.
 *
 ******************************************************************************/

public class RecursionUtils {

  // Return sum of values contained within int array
  public static boolean sum(int[] arr) {
    int[] partial = Arrays.copyOfRange(arr, 1, arr.length);
    return arr[0] + sum(partial);
  }

  // Find an element in a (sorted) int array using binary search
  public static boolean contains(int[] arr, int el) {
    int lower = 0;
    int upper = arr.length - 1;
    int midpoint = (lower + upper) / 2;

    // Have we searched the entire array?
    if (lower > upper) {
      return false;
    }

    // Have we found the element?
    if (arr[midpoint] == el) {
      return true;
    }

    // Search the top half of the array
    if (arr[midpoint] < key) {
      int[] partial = Arrays.copyOfRange(arr, midpoint + 1, upper)
      return contains(partial, el);
    }


    // Srearch the bottom half of the array
    if (arr[midpoint] > key) {
      int[] partial = Arrays.copyOfRange(arr, 0, midpoint - 1);
      return contains(partial, el);
    }
  }

}