// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
// /* react imports */
// import React, { useState } from 'react';

// /* library imports  */
// import { Button, Icon, Modal, Radio, Select } from 'antd';

// /* codePost object imports  */
// import { SolutionFileType } from '../../../../../../../infrastructure/autograder/solutionFile';
// import { SubmissionType } from '../../../../../../../infrastructure/submission';
// import { File, FileType } from '../../../../../../../infrastructure/file';

// interface IProps {
//   submissions: SubmissionType[];
//   setFiles: (files: FileType[] | SolutionFileType[], submission: SubmissionType | undefined) => void;
//   solutionFiles: SolutionFileType[];
// }

// const { Option } = Select;

// export const SubmissionPicker = (props: IProps) => {
//   /******************************* State Variables ****************************/
//   const [visible, setVisible] = useState(false);
//   const [optionIndex, setOptionIndex] = useState(0);
//   const [submissionIndex, setSubmissiionIndex] = useState(-1);

//   /************************** API / State Change Functions ****************************/

//   const setSubmission = async (submission: SubmissionType) => {
//     const filePromises = submission.files.map((f) => {
//       return File.read(f);
//     });
//     const files = await Promise.all(filePromises);
//     props.setFiles(files, submission);
//   };

//   /************************** State Change Functions ****************************/
//   const toggleVisible = () => {
//     setVisible(!visible);
//   };

//   const setSolutionFiles = () => {
//     props.setFiles(props.solutionFiles, undefined);
//   };

//   const onChange = (e: any) => {
//     setOptionIndex(e.target.value);
//   };

//   const onSelect = (e: any) => {
//     setSubmissiionIndex(e);
//   };

//   const onSave = () => {
//     if (optionIndex === 0) {
//       setSolutionFiles();
//     } else {
//       const thisSubmission = props.submissions.find((sub) => {
//         return sub.id === submissionIndex;
//       });
//       if (thisSubmission) {
//         setSubmission(thisSubmission);
//       }
//     }
//     toggleVisible();
//   };

//   /************************** Return ***********************************/

//   const submissionOptions = props.submissions.map((sub) => {
//     return <Option value={sub.id}>{`${sub.students}'s submissions`}</Option>;
//   });

//   return (
//     <div style={{ display: 'flex', justifyContent: 'center' }}>
//       <Icon onClick={toggleVisible} type="edit" />
//       <Modal open={visible} onCancel={toggleVisible} footer={null} width={750}>
//         <Radio.Group onChange={onChange} value={optionIndex}>
//           <Radio value={0}>Solution code</Radio>
//           <Radio value={1}>Student submission</Radio>
//         </Radio.Group>
//         {optionIndex === 1 ? (
//           <Select style={{ minWidth: 300 }} onChange={onSelect}>
//             {submissionOptions}
//           </Select>
//         ) : (
//           <div />
//         )}
//         <Button onClick={onSave}>Save</Button>
//       </Modal>
//     </div>
//   );
// };
