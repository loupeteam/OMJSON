# version 3.11 or later of CMake or needed later for installing GoogleTest
# so let's require it now.
cmake_minimum_required(VERSION 3.11-3.18)

# project(RingBufLib_test)

file(GLOB test_SRC
"*.cpp"
"*.c"
)
