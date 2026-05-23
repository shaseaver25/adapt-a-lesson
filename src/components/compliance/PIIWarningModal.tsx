/**
 * PII Warning Modal
 * 
 * Displays a warning when potential PII is detected in user input.
 * Provides options to edit content or (for admins) override the warning.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ShieldAlert, ArrowLeft, ShieldCheck } from 'lucide-react';
import type { PIIFindingType, PIIRisk } from '@/types/compliance';

/** Human-readable labels for PII finding types */
const FINDING_LABELS: Record<PIIFindingType, string> = {
  email: 'Email address',
  phone: 'Phone number',
  dob: 'Date of birth',
  student_id: 'Student ID number',
  ssn_like: 'Social Security Number pattern',
  name_like_pattern: 'Possible student name',
};

/** Props for the PII Warning Modal */
interface PIIWarningModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** The risk level detected */
  riskLevel: 'medium' | 'high';
  /** Types of PII patterns found */
  findings: PIIFindingType[];
  /** Callback when user chooses to go back and edit */
  onEdit: () => void;
  /** Optional callback for admin override (only shown if provided) */
  onOverride?: () => void;
}

/**
 * Modal component that warns users about detected PII patterns.
 * Blocks submission by default, with optional admin override.
 */
export function PIIWarningModal({
  open,
  riskLevel,
  findings,
  onEdit,
  onOverride,
}: PIIWarningModalProps) {
  const isHighRisk = riskLevel === 'high';
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onEdit()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {isHighRisk ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <ShieldAlert className="h-5 w-5 text-destructive" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
            )}
            <DialogTitle className="text-lg">
              {isHighRisk 
                ? 'Potential Student Information Detected' 
                : 'Possible Personal Information Detected'}
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <DialogDescription asChild>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {isHighRisk
                ? 'We detected patterns that may contain sensitive student information. For FERPA compliance, please remove any identifiable information before continuing.'
                : 'We detected patterns that might contain personal information. To protect student privacy, please review and remove any identifiable details.'}
            </p>
            
            <div className="rounded-md border border-border bg-muted/50 p-3">
              <p className="mb-2 text-sm font-medium text-foreground">
                Detected patterns:
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {findings.map((finding) => (
                  <li key={finding} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                    {FINDING_LABELS[finding]}
                  </li>
                ))}
              </ul>
            </div>
            
            <p className="text-sm text-muted-foreground">
              <strong>Tip:</strong> Use descriptive labels instead of names. 
              For example, use "Reading Group A" instead of student names.
            </p>
          </div>
        </DialogDescription>
        
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="default"
            onClick={onEdit}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back and Edit
          </Button>
          
          {onOverride && (
            <Button
              variant="outline"
              onClick={onOverride}
              className="w-full sm:w-auto"
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              {isHighRisk ? 'Confirm No PII and Continue' : 'Continue Anyway'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
