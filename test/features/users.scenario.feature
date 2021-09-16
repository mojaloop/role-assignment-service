Feature: role-assignment-service server

Scenario: Get User Roles
  Given role-assignment-service server
  When I make a GET User Roles request
  Then The status should be 'OK'

Scenario: Patch User Roles
  Given role-assignment-service server
  When I make a PATCH User Roles request
  Then The status should be 'OK'

Scenario: Get User Participants
  Given role-assignment-service server
  When I make a GET User Participants request
  Then The status should be 'OK'

Scenario: Patch User Participants
  Given role-assignment-service server
  When I make a PATCH User Participants request
  Then The status should be 'OK'
