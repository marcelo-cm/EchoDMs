"use client";

import supabase from "@/supabaseClient";
import "@radix-ui/themes/styles.css";
import {
  Text,
  Card,
  Flex,
  Avatar,
  Box,
  Heading,
  TextField,
  IconButton,
  Button,
  Table,
} from "@radix-ui/themes";
import {
  LockClosedIcon,
  PaperPlaneIcon,
  PersonIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import "../globals.css";

const Dashboard = () => {
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      const user = await supabase.auth.getUser();
      const session = await supabase.auth.getSession();
      if (user.data.user?.id != null) {
        console.log("User is logged in");
        localStorage.setItem(
          "token",
          session.data.session?.access_token as string
        );
        localStorage.setItem("user", user.data.user?.id as string);
        console.log("User is logged in");
        router.push("/dashboard");
      } else {
        router.push("/");
      }
    }
    checkUser();
  }, [router]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push("/");
    }
  };
  return (
    <main className="flex min-h-screen bg-slate-200 flex-col items-center justify-between p-24">
      {/* Founder Contact Card */}
      <Card variant="classic" size="2" style={{ width: 425 }}>
        <Flex justify="between" align="center">
          <Flex gap="4" align="center">
            <Avatar size="4" radius="full" fallback="M" color="indigo" />
            <Box>
              <Text as="div" weight="bold">
                Marcelo Chaman Mallqui
              </Text>
              <Text as="div" color="gray">
                Founder
              </Text>
            </Box>
          </Flex>
          <a href="mailto:marcechaman@gmail.com">
            <Button>
              <Flex direction="row" align="center" gap="2">
                <Text>Contact</Text>
                <PaperPlaneIcon />
              </Flex>
            </Button>
          </a>
        </Flex>
      </Card>
      <Card variant="classic" size="3" className="w-1/2">
        <Flex justify="between">
          <Heading mb="4" size="6">
            Servers & Users
          </Heading>
          <Button>
            Add User
            <PlusIcon />
          </Button>
        </Flex>
        <Flex direction="column" gap="4">
          <Box mt="2">
            <Heading size="4">
              <Flex gap="2" align="center">
                <Avatar fallback="1" />
                Server #1
              </Flex>
            </Heading>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>User</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Echo DMs Sent</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell />
                </Table.Row>
              </Table.Header>
              <Table.Body>
                <Table.Row>
                  <Table.RowHeaderCell>
                    <Flex gap="2" align="center">
                      <Avatar
                        size="2"
                        radius="full"
                        fallback="M"
                        color="indigo"
                      />
                      Marcelo Chaman Mallqui
                    </Flex>
                  </Table.RowHeaderCell>
                  <Table.Cell>
                    <Flex gap="2" height="100%" align="center">
                      123
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    <Flex gap="2" height="100%" align="center">
                      <Button size="2">Edit </Button>
                      <Button size="2" color="red">
                        Delete{" "}
                      </Button>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table.Root>
          </Box>
          <Box mt="2">
            <Heading size="4">
              <Flex gap="2" align="center">
                <Avatar fallback="2" />
                Server #2
              </Flex>
            </Heading>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>User</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Echo DMs Sent</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell />
                </Table.Row>
              </Table.Header>
              <Table.Body>
                <Table.Row>
                  <Table.RowHeaderCell>
                    <Flex gap="2" align="center">
                      <Avatar
                        size="2"
                        radius="full"
                        fallback="M"
                        color="indigo"
                      />
                      Marcelo Chaman Mallqui
                    </Flex>
                  </Table.RowHeaderCell>
                  <Table.Cell>
                    <Flex gap="2" height="100%" align="center">
                      123
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    <Flex gap="2" height="100%" align="center">
                      <Button size="2">Edit </Button>
                      <Button size="2" color="red">
                        Delete{" "}
                      </Button>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table.Root>
          </Box>
        </Flex>
      </Card>
      <Card>
        - add servers <br />- server ID - what info can i pull using slack api
        by just having the server id? <br />- ‘add users’ screen [edit info
        dialog] <br />
        – can i get the list of users from slack api? <br />- name <br />- oauth
        key <br />- proxy password (optional)
      </Card>
      <Button onClick={handleSignOut}>Sign Out</Button>
    </main>
  );
};

export default Dashboard;
