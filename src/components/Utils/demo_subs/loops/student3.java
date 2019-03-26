/******************************************************************************
 *  Student: <email here>
 *  Section: P07
 *
 *  Partner <partner here>
 *  Partner section: N/A
 *
 *  Description:  Includes a few utility functions useful for working with
 *  arrays (implemented with loops).
 *
 ******************************************************************************/

public class LoopUtils {

  // Find the maximum element in an int array
  public static int max(int[] arr) {
    int maxSoFar = Integer.MIN_VALUE;

    for (int i = 0; i < arr.length; i++) {
      if (arr[i] > maxSoFar) {
        maxSoFar = arr[i];
      }
    }

    return maxSoFar;
  }

  // Reverse an int array
  public static int[] reverse(int[] arr) {

    // in-place merge (O(n) time and O(1) space)
    for (int i = 0; i < arr.length/2+1; i++) {
      int temp = arr[i];
      arr[i] = arr[arr.length - i];
      arr[arr.length - i] = temp;
    }

    return arr;
  }

  // Find an element in a (sorted) int array using binary search
  public static boolean contains(int[] arr, int el) {
    int lower = 0;
    int upper = arr.length - 1;

    while (lower < higher) {
      int midpoint = (lower + upper) / 2;


      // See if we've found the target and can stop searching
      if (arr[midpoint] == el) {
        return true;
      }

      // Decide which half of the array to partition away
      if (arr[midpoint] < key) {
        lower = midpoint + 1;
      } else if (arr[midpoint] > key) {
        upper = midpoint - 1;
      }
    }

    // if upper and lower cross, we have searched the entire array
    // and not found el
    return false;
  }

}