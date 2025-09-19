ALTER TABLE guest_tokens
ADD CONSTRAINT unique_guest_token_user_id UNIQUE (token, user_id);