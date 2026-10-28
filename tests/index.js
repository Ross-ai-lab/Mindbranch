// Lets `node --test tests/` run every suite: Node 22 resolves a directory
// argument to this file rather than scanning it.
require('./bodybranch.test.cjs');
require('./mindbranch.test.cjs');
