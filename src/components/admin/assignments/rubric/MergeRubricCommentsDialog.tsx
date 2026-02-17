import { FC, useState, useMemo, useCallback } from 'react';
import { ArrowRightOutlined, BranchesOutlined } from '@ant-design/icons';
import { Modal, Spin } from 'antd';
import Select from 'react-select';

import { commentsApi, rubricCommentsApi } from '../../../../api-client/clients';
import { RubricCategory, RubricComment } from '../../../../api-client';
import { Assignment, IRubricCategoryToRubricCommentsMap } from '../../../../types/common';
import { RubricCommentInstanceList } from '../../../../types/rubric';
import CPButton from '../../../../components/core/CPButton';

interface IMergeRubricCommentsDialogProps {
  rubricCategories: RubricCategory[];
  rubricComments: IRubricCategoryToRubricCommentsMap;
  isDisabled: boolean;
  assignment: Assignment;
  reloadRubric: (assignment: Assignment, shouldLoadInstances: boolean, shouldLoadFeedback: boolean) => Promise<void>;
}

const MergeRubricCommentsDialog: FC<IMergeRubricCommentsDialogProps> = ({
  rubricCategories,
  rubricComments,
  isDisabled,
  assignment,
  reloadRubric,
}) => {
  const [visible, setVisible] = useState(false);
  const [fromComment, setFromComment] = useState<RubricComment | null>(null);
  const [toComment, setToComment] = useState<RubricComment | null>(null);
  const [fromCommentInstances, setFromCommentInstances] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const openDialog = useCallback(() => {
    setFromComment(null);
    setToComment(null);
    setVisible(true);
  }, []);

  const closeDialog = useCallback(() => {
    setFromComment(null);
    setToComment(null);
    setVisible(false);
  }, []);

  const onChangeFromComment = useCallback(async (selected: any) => {
    if (!selected) {
      setFromComment(null);
      setFromCommentInstances([]);
      return;
    }
    const response = (await rubricCommentsApi.retrieve({
      id: selected.comment.id,
    })) as unknown as RubricCommentInstanceList;
    const instanceList = response.comments;
    setFromComment(selected.comment);
    setFromCommentInstances(instanceList);
  }, []);

  const onChangeToComment = useCallback((selected: any) => {
    setToComment(selected ? selected.comment : null);
  }, []);

  const mergeComments = useCallback(() => {
    if (!fromComment || !toComment) {
      return;
    }

    if (fromComment.id === toComment.id) {
      return;
    }

    setIsLoading(true);

    const relinkCommentPromises = fromCommentInstances.map((commentID: number) => {
      return commentsApi.partialUpdate({
        id: commentID,
        patchedComment: {
          rubricComment: toComment.id,
        },
      });
    });

    Promise.all(relinkCommentPromises)
      .then(() => {
        rubricCommentsApi.destroy({ id: fromComment.id }).then(() => {
          reloadRubric(assignment, false, false).then(() => {
            closeDialog();
            setIsLoading(false);
          });
        });
      })
      .catch(() => {
        const undoLinkCommentPromises = fromCommentInstances.map((commentID: number) => {
          return commentsApi.partialUpdate({
            id: commentID,
            patchedComment: {
              rubricComment: fromComment.id,
            },
          });
        });

        Promise.all(undoLinkCommentPromises);
        closeDialog();
        setIsLoading(false);
      });
  }, [fromComment, toComment, fromCommentInstances, assignment, reloadRubric, closeDialog]);

  const groupedOptions = useMemo(() => {
    const options: Array<{
      label: string;
      options: Array<{ label: string; value: number; comment: RubricComment }>;
    }> = [];

    rubricCategories.forEach((rubricCategory: RubricCategory) => {
      if (Object.prototype.hasOwnProperty.call(rubricComments, rubricCategory.id)) {
        const comments = rubricComments[rubricCategory.id].map((rubricComment: RubricComment) => {
          return {
            label: rubricComment.text || '',
            value: rubricComment.id,
            comment: rubricComment,
          };
        });

        options.push({
          label: rubricCategory.name,
          options: comments,
        });
      }
    });

    return options;
  }, [rubricCategories, rubricComments]);

  const currentFromCommentOption = fromComment
    ? {
        value: fromComment.id,
        label: fromComment.text,
        comment: fromComment,
      }
    : null;

  const currentToCommentOption = toComment
    ? {
        value: toComment.id,
        label: toComment.text,
        comment: toComment,
      }
    : null;

  return (
    <div>
      <CPButton
        onClick={openDialog}
        disabled={isDisabled}
        cpType="secondary"
        icon={<BranchesOutlined />}
        fallbackIcon={<BranchesOutlined />}
        fallbackWidth={1250}
      >
        Merge
      </CPButton>
      <Modal open={visible} title="Merge rubric comments" onCancel={closeDialog} onOk={mergeComments} okText="Merge">
        {isLoading ? (
          <Spin />
        ) : (
          <div>
            <div>
              Merging will
              <ul>
                <li>delete the 'From' rubric comment, and</li>
                <li>relink all of its comments to the 'To' rubric comment</li>
              </ul>
              This action cannot be undone.
              <br />
              <br />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: '2 2 auto' }}>
                <Select
                  id="fromSelect"
                  options={groupedOptions}
                  value={currentFromCommentOption}
                  onChange={onChangeFromComment}
                />
              </div>
              <div style={{ flex: ' 0 0 50px', textAlign: 'center' }}>
                <ArrowRightOutlined />
              </div>
              <div style={{ flex: '2 2 auto' }}>
                <Select
                  id="toSelect"
                  options={groupedOptions}
                  value={currentToCommentOption}
                  onChange={onChangeToComment}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MergeRubricCommentsDialog;
