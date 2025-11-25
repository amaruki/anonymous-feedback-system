-- Add missing AI fields to feedback table if they don't exist
-- This migration adds additional AI analysis columns

DO $$ 
BEGIN
  -- Add ai_category if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'feedback' AND column_name = 'ai_category') THEN
    ALTER TABLE feedback ADD COLUMN ai_category TEXT;
  END IF;

  -- Add ai_sentiment if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'feedback' AND column_name = 'ai_sentiment') THEN
    ALTER TABLE feedback ADD COLUMN ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative', 'mixed'));
  END IF;

  -- Add ai_priority if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'feedback' AND column_name = 'ai_priority') THEN
    ALTER TABLE feedback ADD COLUMN ai_priority TEXT CHECK (ai_priority IN ('low', 'medium', 'high', 'critical'));
  END IF;

  -- Add ai_summary if not exists  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'feedback' AND column_name = 'ai_summary') THEN
    ALTER TABLE feedback ADD COLUMN ai_summary TEXT;
  END IF;

  -- Add ai_keywords if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'feedback' AND column_name = 'ai_keywords') THEN
    ALTER TABLE feedback ADD COLUMN ai_keywords TEXT[] DEFAULT '{}';
  END IF;

  -- Add rating if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'feedback' AND column_name = 'rating') THEN
    ALTER TABLE feedback ADD COLUMN rating INTEGER;
  END IF;
END $$;

-- Create index for AI sentiment analysis
CREATE INDEX IF NOT EXISTS idx_feedback_ai_sentiment ON feedback(ai_sentiment);
CREATE INDEX IF NOT EXISTS idx_feedback_ai_priority ON feedback(ai_priority);
