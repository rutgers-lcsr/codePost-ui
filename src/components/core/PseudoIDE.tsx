import * as React from 'react';

import SplitPane from 'react-split-pane';

import { Icon, Menu } from 'antd';

import { CodeWindow } from '../admin/assignments/tests/edit/utils/CodeWindow';
import useWindowSize from './useWindowSize';

const ccc = `/******************************************************************************
 *  Name:    Student
 *
 *  Description: Reads election data, by numbers of votes in electoral
 * districts. Outputs the number of electoral votes each candidate won after
 * their names, and the smallest number of electoral votes that would be
 * necessary to win the election.
 *
 * This is a change
 ******************************************************************************/
public class Election {

    // gives the least integer which is larger than n/2
    // Examples: majorityOf(10) = 6, majorityOf(11) = 6
    public static int majorityOf(int n) {
        return n/2 + 1;
    }

    public static void main(String[] args) {
        String candidate1 = StdIn.readString(); // name of candidate 1
        String candidate2 = StdIn.readString(); // name of candidate 2

        // number of electoral votes candidate 1 receives
        int c1ElectoralVoteCount = 0;

        // number of electoral votes candidate 2 receives
        int c2ElectoralVoteCount = 0;

        // the total number of electoral votes at stake
        int totalElectoralVotes = 0;

        while (!StdIn.isEmpty()) { // read in data row-by-row until empty
            String regionName = StdIn.readString();

            // number of electoral votes at stake in the region
            int regionElectoralVotes = StdIn.readInt();

            // number of votes for candidate 1 in that region
            int votesC1 = StdIn.readInt();

            // number of votes for candidate 2 in the region
            int votesC2 = StdIn.readInt();

            // if more people voted for candidate 1, increment their electoral
            // votes
            if (votesC1 > votesC2)
                c1ElectoralVoteCount += regionElectoralVotes;


            // if more people voted for candidate 2, increment their electoral
            // votes
            else if (votesC2 > votesC1)
                c2ElectoralVoteCount += regionElectoralVotes;


            // if there is a tie, nothing happens to the candidate counts
            // but we increment the totalVoteCount no matter what

            totalElectoralVotes += regionElectoralVotes;

        }

        // output candidate names, number of electoral votes won, and
        // the number necessary to win using the majorityOf method
        StdOut.print(candidate1 + "  " + c1ElectoralVoteCount + ". ");
        StdOut.print(candidate2 + "  " + c2ElectoralVoteCount + ". ");
        StdOut.println(majorityOf(totalElectoralVotes) + " needed to win");

    }
}`;

const PseudoIDE = (props: any) => {
  const height = useWindowSize().height * 0.85;

  return (
    <div style={{ border: '2px solid blue', height: `${height}px`, position: 'relative' }} className="pseudo-ide">
      <SplitPane split="vertical" defaultSize="20%">
        <div>
          <div style={{ backgroundColor: '#fafafa', padding: '8px 16px', fontSize: '20px', fontWeight: 500 }}>
            Files
          </div>
          <Menu defaultSelectedKeys={['2']} defaultOpenKeys={['1']} mode="inline" style={{ height: '100%' }}>
            <Menu.SubMenu
              key={'1'}
              title={
                <span>
                  <Icon type="folder" />
                  folder1{' '}
                </span>
              }
            >
              <Menu.Item key={'2'}>hello.java &nbsp;</Menu.Item>
              <Menu.Item key={'3'}>loops.java &nbsp;</Menu.Item>
              <Menu.Item key={'4'}>recursion.java &nbsp;</Menu.Item>
            </Menu.SubMenu>
          </Menu>
        </div>
        <SplitPane split="vertical" defaultSize="50%" pane1Style={{ overflowY: 'auto' }}>
          <div>
            <div style={{ display: 'flex' }}>
              <div style={{ backgroundColor: '#fafafa', fontSize: '12px', fontWeight: 500, padding: '8px 20px' }}>
                hello.java
              </div>
              <div style={{ flexGrow: 1 }} />
            </div>
            <CodeWindow code={ccc} name={'hello.java'} onSave={undefined} height={'450px'} />
          </div>
          <div>pane 3</div>
        </SplitPane>
      </SplitPane>
    </div>
  );
};

export default PseudoIDE;
