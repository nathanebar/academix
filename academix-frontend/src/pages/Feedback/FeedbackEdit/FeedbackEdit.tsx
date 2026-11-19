// FeedbackEdit.tsx
import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import FeedbackForm from './FeedbackForm/FeedbackForm';
import FeedbackView from './FeedbackView/FeedbackView';

interface FeedbackEditProps {
  mode: 'fill' | 'view';
}

const FeedbackEdit: React.FC<FeedbackEditProps> = ({ mode }) => {
  const { taskId } = useParams<{ taskId: string }>();
  const { taskAssignmentId } = useParams<{ taskAssignmentId: string }>();

  const [searchParams] = useSearchParams();

  const dates = searchParams.get('dates')?.split(',').filter(Boolean) || [];
  const assignmentIds = searchParams.get('assignmentIds')?.split(',').filter(Boolean) || [];

  return (
    <div>
      {mode === 'fill' ? (
        <FeedbackForm 
          taskId={taskId} 
          dates={dates} 
          assignmentIds={assignmentIds} 
        />
      ) : (
        <FeedbackView taskAssignmentId={Number(taskAssignmentId)} />
      )}
    </div>
  );
};

export default FeedbackEdit;